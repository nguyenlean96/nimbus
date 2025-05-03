import React, { useState } from 'react'

type ItemProps = {
  item: any;
}

const Item: React.FC<ItemProps> = ({
  item
}) => {
  const [expandUrls, setExpandUrls] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_HOST
  return (
    <>
      <div className='relative flex items-center space-x-2 mb-2 w-full'>
        <div className='bg-orange-500 text-white rounded aspect-square h-6 px-1 text-center'>{item.id}</div>
        <div className=''>{item.fileName}</div>
        <div
          onClick={() => setExpandUrls((prev: boolean) => !prev)}
          className='absolute top-1/2 -translate-y-1/2 right-2 z-10'
        >
          <div className={
            'w-5 h-5 rounded-full flex items-center justify-center cursor-pointer bg-blue-500 text-[#aaa] hover:text-[#fff] transition-all duration-200 ease-in-out '
            + (expandUrls ? 'rotate-180' : '')
          }>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 512 512" stroke='currentColor' fill='currentColor'>
              <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
            </svg>
          </div>
        </div>
      </div>
      <div className='w-full max-w-full overflow-hidden flex justify-end'>
        {
          expandUrls && (
            <table className='w-3/4 max-w-3/4 rounded-xl bg-[#444]'>
              <tbody>
                {Object.keys(item.urls).map((key) => (
                  <tr key={key} className='rounded-lg p-1 px-2 my-1 max-w-full'>
                    <td className='p-1.5 pl-2'>
                      <div className='bg-slate-600 text-sm text-white rounded aspect-square h-6 px-1 text-center'>{key}</div>
                    </td>
                    <td className='truncate p-1'>
                      <a href={`${BACKEND_URL}${item.urls[key]}`} target='_blank' className='text-ellipsis text-sm text-blue-500 hover:text-blue-700'>{item.urls[key]}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </>
  )
}

export default Item