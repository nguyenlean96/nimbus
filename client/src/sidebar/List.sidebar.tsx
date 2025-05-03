import React, { useState } from 'react'
import Item from './Item.sidebar';

type FileListProps = {
  isLoading: boolean;
  data: any;
  error: any;
}

const FileList: React.FC<FileListProps> = ({ isLoading, data, error }) => {
  return (
    <ul className='flex-1 h-full overflow-y-auto max-w-full p-2 space-y-2'>
      {isLoading && <li>Loading...</li>}
      {
        data ? data.map((item: any) => (
          <li key={item.id} className='bg-[#888] rounded-lg p-1 px-2 max-w-full transition-all duration-200 ease-in-out delay-100'>
            <Item item={item} />
          </li>
        ))
          : error && <li>{JSON.stringify(error)}</li>
      }
    </ul>
  )
}

export default FileList