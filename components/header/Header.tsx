import React from 'react';
import { useRouter } from 'next/router';
import { Bars3Icon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 justify-between">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center flex-col">
      <div className="flex-1 text-center items-center flex-shrink-0 rounded-md px-2 py-1 text-sm sm:text-md md:text-lg md:text-xl font-medium text-blue-400">
        InfraChat
      </div>
      <div className="text-center items-center flex-shrink-0 px-2 py-1 text-xs sm:text-xs md:text-sm md:text-md font-medium text-blue-400">
        Powered by Infrastructure Technology Services
      </div>
    </div>
    
    {/* Add this link to your header */}
          <a href="http://localhost:5173/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
        Document Generator
      </a>

      {/* Add this link to your header */}
          <a href="https://transportcloud.sharepoint.com/sites/tfnsw-DigitalEngineeringServices/SitePages/Digital-Engineering-Innovation-Hub.aspx?xsdata=MDV8MDF8fGEyNjcxYTA1YWIyZTQwYzgzYzkxMDhkYjgzNGYzOTVkfGNiMzU2NzgyYWQ5YTQ3ZmI4NzhiN2ViY2ViODViODZjfDB8MHw2MzgyNDgxNDg0OTExMjM4NTd8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKV0lqb2lNQzR3TGpBd01EQWlMQ0pRSWpvaVYybHVNeklpTENKQlRpSTZJazkwYUdWeUlpd2lWMVFpT2pFeGZRPT18MXxMMk5vWVhSekx6RTVPbTFsWlhScGJtZGZUWHBPYlZscVp6Rk5WMUYwVFcxSk5FNTVNREJQVkdSdFRGUm9hMDVYU1hST1ZFMDFXbTFXYVU5SFVUQk5hazEzUUhSb2NtVmhaQzUyTWk5dFpYTnpZV2RsY3k4eE5qZzVNakU0TURRNE56VXh8ZDE1ZjBiMmYwZmRlNDc4M2RhNDMwOGRiODM0ZjM5NWF8NzJlM2VlZTY4OTRmNDY3YmE4OWZiYjI3ZGZjMTMxMzQ%3d&sdata=ZW1pUkxrdGhjLzZaMlMxU1pSWTV6UktSQ0pReFRHU3pwVmpnRTZhb2NNND0%3d&ovuser=cb356782-ad9a-47fb-878b-7ebceb85b86c%2cHouman.Hatamian%40transport.nsw.gov.au&OR=Teams-HL&CT=1689219978953&clickparams=eyJBcHBOYW1lIjoiVGVhbXMtRGVza3RvcCIsIkFwcFZlcnNpb24iOiI0MS8yMzA2MDQwMTE2MSIsIkhhc0ZlZGVyYXRlZFVzZXIiOmZhbHNlfQ%3d%3d&SafelinksUrl=https%3a%2f%2ftransportcloud.sharepoint.com%2fsites%2ftfnsw-DigitalEngineeringServices%2fSitePages%2fDigital-Engineering-Innovation-Hub.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
        Contact Us
      </a>

      <div className="flex-shrink-0" onClick={() => router.push('/settings')}>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Cog6ToothIcon
            className="-ml-0.5 h-4 w-4 sm:w-5 sm:h-5"
            aria-hidden="true"
          />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
