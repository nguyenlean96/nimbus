import { useEffect, useState } from 'react'
import FileList from './sidebar/List.sidebar'

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
      setData(resData.data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);
  return (
    <main className='w-screen h-screen overflow-hidden flex flex-col'>
      <section className='flex flex-col min-h-full w-1/3 overflow-hidden bg-[#222]'>
        <div className='flex items-center p-1 justify-end text-[#aaa]'>
          <span className='block'>Total files: {data && data.length}</span>
        </div>
        <FileList
          isLoading={isLoading} data={data} error={error} />
      </section>
      <section className='flex-1 min-h-full'></section>
    </main>
  )
}

export default App
