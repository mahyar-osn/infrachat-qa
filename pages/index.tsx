import React, {
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Document } from 'langchain/document';

import { useChats, useNamespaces, useKeys } from '@/hooks';

import { Dialog } from '@headlessui/react';
import { ConversationMessage, Message } from '@/types';

import { ChatForm, EmptyState, MessageList } from '@/components/main';
import SidebarList from '@/components/sidebar/SidebarList';
import Header from '@/components/header/Header';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [modelTemperature, setModelTemperature] = useState<number>(0.5);

  const [returnSourceDocuments, setReturnSourceDocuments] =
    useState<boolean>(false);

  const {
    openAIapiKey,
    pineconeApiKey,
    pineconeEnvironment,
    pineconeIndexName,
  } = useKeys();

  const {
    namespaces,
    selectedNamespace,
    setSelectedNamespace,
    isLoadingNamespaces,
  } = useNamespaces(pineconeApiKey, pineconeIndexName, pineconeEnvironment);

  const {
    chatList,
    selectedChatId,
    setSelectedChatId,
    createChat,
    deleteChat,
    chatNames,
    updateChatName,
    filteredChatList,
    getConversation,
    updateConversation,
  } = useChats(selectedNamespace);

  const userHasNamespaces = namespaces.length > 0;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<{
    messages: ConversationMessage[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to know about these documents?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  function mapConversationMessageToMessage(
    ConversationMessage: ConversationMessage,
  ): Message {
    return {
      ...ConversationMessage,
      sourceDocs: ConversationMessage.sourceDocs?.map((doc: Document) => ({
        pageContent: doc.pageContent,
        metadata: { source: doc.metadata.source },
      })),
    };
  }

  const { messages, history } = conversation;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const fetchChatHistory = useCallback(() => {
    try {
      const conversations = getConversation(selectedChatId);

      if (!conversations || !conversations.messages) {
        console.error('Failed to fetch chat history: No conversations found.');
        return;
      }

      const pairedMessages: [any, any][] = [];
      const data = conversations.messages;

      for (let i = 0; i < data.length; i += 2) {
        pairedMessages.push([data[i], data[i + 1]]);
      }

      setConversation((conversation) => ({
        ...conversation,
        messages: data.map((message: any) => ({
          type: message.type === 'userMessage' ? 'userMessage' : 'apiMessage',
          message: message.message,
          sourceDocs: message.sourceDocs?.map((doc: any) => ({
            pageContent: doc.pageContent,
            metadata: { source: doc.metadata.source },
          })),
        })),
        history: pairedMessages.map(([userMessage, botMessage]: any) => [
          userMessage.message,
          botMessage?.message || '',
        ]),
      }));
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  }, [selectedChatId, getConversation]);

  useEffect(() => {
    if (selectedNamespace && chatList.length > 0 && !selectedChatId) {
      setSelectedChatId(chatList[0].chatId);
    }
  }, [
    selectedNamespace,
    chatList,
    selectedChatId,
    setSelectedChatId,
    openAIapiKey,
    pineconeApiKey,
    pineconeEnvironment,
    pineconeIndexName,
  ]);

  useEffect(() => {
    if (chatList.length > 0) {
      setSelectedChatId(chatList[chatList.length - 1].chatId);
    }
  }, [
    selectedNamespace,
    setSelectedChatId,
    chatList,
    openAIapiKey,
    pineconeApiKey,
    pineconeEnvironment,
    pineconeIndexName,
  ]);

  useEffect(() => {
    if (selectedChatId) {
      fetchChatHistory();
    }
  }, [
    selectedChatId,
    fetchChatHistory,
    openAIapiKey,
    pineconeApiKey,
    pineconeEnvironment,
    pineconeIndexName,
  ]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();
    setConversation((conversation) => ({
      ...conversation,
      messages: [
        ...conversation.messages,
        {
          type: 'userMessage',
          message: question,
        } as ConversationMessage,
      ],
    }));

    setLoading(true);
    setQuery('');

    const conversation = getConversation(selectedChatId);
    if (
      !openAIapiKey ||
      !pineconeApiKey ||
      !pineconeEnvironment ||
      !pineconeIndexName
    ) {
      console.error('API keys not found.');
      return;
    }
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenAI-Key': openAIapiKey,
        'X-Pinecone-Key': pineconeApiKey,
        'X-Pinecone-Environment': pineconeEnvironment,
        'X-Pinecone-Index-Name': pineconeIndexName,
      },
      body: JSON.stringify({
        question,
        history: conversation.history,
        selectedChatId,
        selectedNamespace,
        returnSourceDocuments,
        modelTemperature,
      }),
    });

    const data = await response.json();

    if (data.error) {
      setError(data.error);
    } else {
      setConversation((prevConversation) => {
        const updatedConversation = {
          ...prevConversation,
          messages: [
            ...prevConversation.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments
                ? data.sourceDocuments.map(
                    (doc: any) =>
                      new Document({
                        pageContent: doc.pageContent,
                        metadata: { source: doc.metadata.source },
                      }),
                  )
                : undefined,
            } as ConversationMessage,
          ],
          history: [
            ...prevConversation.history,
            [question, data.text] as [string, string],
          ],
        };

        updateConversation(selectedChatId, updatedConversation);
        return updatedConversation;
      });
    }

    setLoading(false);
    messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
  }

  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const nameSpaceHasChats = filteredChatList.length > 0;
  
  // your other state variables...
  const [firstVisit, setFirstVisit] = useState(true);

  // for showing and hiding modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);
  
  const handleOkClick = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <div className="h-full">
      <title>InfraChat Q&A</title>

        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button
                        type="button"
                        className="-m-2.5 p-2.5"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                    <div className="flex h-16 shrink-0 items-center"></div>
                    <SidebarList
                      createChat={createChat}
                      selectedNamespace={selectedNamespace}
                      setSelectedNamespace={setSelectedNamespace}
                      namespaces={namespaces}
                      filteredChatList={filteredChatList.map(
                        (chat) => chat.chatId,
                      )}
                      selectedChatId={selectedChatId}
                      setSelectedChatId={setSelectedChatId}
                      chatNames={chatNames}
                      updateChatName={updateChatName}
                      deleteChat={deleteChat}
                      returnSourceDocuments={returnSourceDocuments}
                      setReturnSourceDocuments={setReturnSourceDocuments}
                      modelTemperature={modelTemperature}
                      setModelTemperature={setModelTemperature}
                      nameSpaceHasChats={nameSpaceHasChats}
                      isLoadingNamespaces={isLoadingNamespaces}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col h-screen overflow-y-hidden">
          <div className="flex grow flex-col bg-gray-900 pb-4 border-r border-gray-800 h-full">
            <div className="flex h-8 shrink-0 items-center"></div>
            <SidebarList
              createChat={createChat}
              selectedNamespace={selectedNamespace}
              setSelectedNamespace={setSelectedNamespace}
              namespaces={namespaces}
              filteredChatList={filteredChatList.map((chat) => chat.chatId)}
              selectedChatId={selectedChatId}
              setSelectedChatId={setSelectedChatId}
              chatNames={chatNames}
              updateChatName={updateChatName}
              deleteChat={deleteChat}
              returnSourceDocuments={returnSourceDocuments}
              setReturnSourceDocuments={setReturnSourceDocuments}
              modelTemperature={modelTemperature}
              setModelTemperature={setModelTemperature}
              nameSpaceHasChats={nameSpaceHasChats}
              isLoadingNamespaces={isLoadingNamespaces}
            />
          </div>
        </div>
        <div className="lg:pl-72 h-screen">
          <Header setSidebarOpen={setSidebarOpen} />

          {/* Welcome modal */}
          {isModalOpen && (
            <div className="modal fixed w-full h-full top-0 left-0 flex items-center justify-center">
              <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>
              <div className="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
                <div className="modal-content py-4 text-left px-6">
                  <div className="flex justify-between items-center pb-3">
                    <p className="text-2xl font-bold">Welcome to InfraChat, Powered by Infratech</p>
                    <div className="modal-close cursor-pointer z-50" onClick={handleOkClick}>
                      <svg className="fill-current text-black" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                        <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
                      </svg>
                    </div>
                  </div>

                <div className="text-base mb-4">
                  InfraChat is a pilot project from Infrastructure Technology Services, it leverages cutting-edge AI technology to provide two key services:
                </div>

                <ul className="list-disc list-inside text-base mb-4">
                  <li>
                    <span className="font-bold">
                      Question-Answering:&nbsp;
                    </span>
                     InfraChat is equipped with a powerful question-answering feature. You can ask any question relating to NSW AI Assurance Framework and TfNSW Digital Engineering Framework, and InfraChat will provide a detailed answer based on its extensive training data. This feature can be used for quick information retrieval, fact-checking, learning new topics, and more.
                  </li>

                  <li>
                    <span className="font-bold">
                      Document Generation:&nbsp;
                    </span>
                     InfraChat can also generate detailed documents based on user-provided prompts. This feature can be used to create reports, articles, summaries, and more, saving you time and effort. Simply provide a brief description or a few keywords, and InfraChat will generate a comprehensive document that meets your needs.
                  </li>
                </ul>

                <div className="text-base mb-4">
                  Please note that while InfraChat strives for accuracy, due to the inherent limitations of AI models, there may be instances of inaccuracies or unexpected responses. We are re continuously working to improve and refine the system. We strongly advise not to use any sensitive or corporate-specific information while interacting with InfraChat.
                </div>

                <button onClick={handleOkClick} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded">
                  Let&apos;s go!
                </button>
                </div>
              </div>
            </div>
          )}


          <main className="flex flex-col">
            {selectedNamespace !== '' && nameSpaceHasChats ? (
              <div className="flex-grow pb-36">
                <div className="h-full">
                  <MessageList
                    messages={messages.map(mapConversationMessageToMessage)}
                    loading={loading}
                    messageListRef={messageListRef}
                  />
                </div>
              </div>
            ) : (
              <EmptyState
                nameSpaceHasChats={nameSpaceHasChats}
                selectedNamespace={selectedNamespace}
                userHasNamespaces={userHasNamespaces}
              />
            )}

            {nameSpaceHasChats && selectedNamespace && (
              <div className="fixed w-full bottom-0 flex bg-gradient-to-t from-gray-800 to-gray-800/0 justify-center lg:pr-72">
                <ChatForm
                  loading={loading}
                  error={error}
                  query={query}
                  textAreaRef={textAreaRef}
                  handleEnter={handleEnter}
                  handleSubmit={handleSubmit}
                  setQuery={setQuery}
                />
              </div>
            )}
            
          </main>
        </div>
      </div>

      {/* {!accepted && 
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Disclaimer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please note that InfraChat is currently in its pilot phase with limited user access. As an AI-powered tool, while we strive for accuracy, there may be instances of inaccuracies or unexpected responses. We're continuously working to improve and refine the system. We strongly advise not to use any sensitive or corporate-specific information while interacting with InfraChat. Any information shared is used solely for the purpose of improving the system's responses.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleAccept}>
                  I Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      }
 */}
    </>
  );
}
