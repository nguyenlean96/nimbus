import { useEffect, useState } from 'react'

function App() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_HOST
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  const fetchData = async () => {
    console.log('fetching data',)
    if (isLoading) return
    try {
      const response = await fetch(BACKEND_URL + '/api/v1/media');
      const resData = await response.json();
      setData(resData);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);
  return (
    <main className='w-screen h-screen overflow-hidden flex flex-col'>
      <section className='min-h-full w-1/3 overflow-hidden bg-[#222]'>
        <div className='flex items-center p-1 justify-end text-[#aaa]'>
          <span className='block'>Total files: {data && data.length}</span>
        </div>
        <ul className='h-full overflow-y-auto max-w-full p-2 space-y-2'>
          {isLoading && <li>Loading...</li>}
          {
            data ? data.map((item: any) => (
              <li key={item.id} className='bg-[#888] rounded-lg p-1 px-2 max-w-full'>
                <div className='flex items-center space-x-2 mb-2'>
                  <div className='bg-orange-500 text-white rounded aspect-square h-6 px-1 text-center'>{item.id}</div>
                  <div className=''>{item.fileName}</div>
                </div>
                <div className='w-full max-w-full overflow-hidden flex justify-end'>
                  <table className='w-3/4 max-w-3/4 rounded-xl bg-[#444]'>
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
                  </table>
                </div>
              </li>
            ))
              : error && <li>{JSON.stringify(error)}</li>
          }
        </ul>
      </section>
      <section className='flex-1 min-h-full'></section>
    </main>
  )
}

export default App
