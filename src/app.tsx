import { Plus, Search, Filter, FileDown, MoreHorizontal, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Header } from './components/header'
import { Tabs } from './components/tabs'
import { Button } from './components/ui/button'
import { Control, Input } from './components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table'
import { Pagination } from './components/pagination'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { FormEvent, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CreateTagForm } from './components/create-tag-form'

export interface TagResponse {
  first: number
  prev: number | null
  next: number
  last: number
  pages: number
  items: number
  data: Tag[]
}

export interface Tag {
  title: string
  slug: string
  amountOfVideos: number
  id: string
}

export function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlFilter = searchParams.get('filter') ?? ''
  
  const [filter, setFilter] = useState(urlFilter)
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false)

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1

  const { data: tagsResponse, isLoading, isFetching, isError, refetch } = useQuery<TagResponse>({
    queryKey: ['get-tags', urlFilter, page],
    queryFn: async () => {
      try {
        const url = new URL('http://localhost:3333/tags')
        url.searchParams.set('_page', String(page))
        url.searchParams.set('_per_page', '10')
        if (urlFilter) {
          url.searchParams.set('title', urlFilter)
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1200)

        const response = await fetch(url.toString(), { signal: controller.signal })
        clearTimeout(timeoutId)

        if (response.ok) {
          return await response.json()
        }
      } catch {
        // Fallback gracioso para GitHub Pages ou quando a API local estiver indisponível
      }

      // Carrega server.json estático (para produção/GitHub Pages)
      const staticResponse = await fetch(`${import.meta.env.BASE_URL}server.json`)
      if (!staticResponse.ok) {
        throw new Error('Falha ao carregar tags.')
      }

      const staticData: { tags: Tag[] } = await staticResponse.json()
      let filtered = staticData.tags || []

      if (urlFilter) {
        const query = urlFilter.toLowerCase()
        filtered = filtered.filter(t =>
          (t.title || '').toLowerCase().includes(query) ||
          (t.slug || '').toLowerCase().includes(query)
        )
      }

      const perPage = 10
      const totalItems = filtered.length
      const totalPages = Math.ceil(totalItems / perPage) || 1
      const startIndex = (page - 1) * perPage
      const pageData = filtered.slice(startIndex, startIndex + perPage)

      return {
        first: 1,
        prev: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : page,
        last: totalPages,
        pages: totalPages,
        items: totalItems,
        data: pageData,
      }
    },
    placeholderData: keepPreviousData,
  })

  function handleFilter(event: FormEvent) {
    event.preventDefault()

    setSearchParams(params => {
      params.set('page', '1')
      if (filter.trim()) {
        params.set('filter', filter.trim())
      } else {
        params.delete('filter')
      }

      return params
    })
  }

  return (
    <div className="py-10 space-y-8">
      <div>
        <Header />
        <Tabs />
      </div>
      <main className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Tags</h1>

          <Dialog.Root open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
            <Dialog.Trigger asChild>
              <Button variant='primary'>
                <Plus className="size-3" />
                Create new
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
              <Dialog.Content className="fixed space-y-10 p-10 right-0 top-0 bottom-0 h-screen min-w-[320px] z-50 bg-zinc-950 border-l border-zinc-900">
                <div className="space-y-3">
                  <Dialog.Title className="text-xl font-bold">
                    Create tag
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-zinc-500">
                    Tags can be used to group videos about similar concepts.
                  </Dialog.Description>
                </div>

                <CreateTagForm onSuccess={() => setIsCreateTagOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {isFetching && <Loader2 className="size-4 animate-spin text-zinc-500" />}
        </div>

        <div className="flex items-center justify-between">
          <form onSubmit={handleFilter} className="flex items-center gap-2">
            <Input variant='filter'>
              <Search className="size-3" />
              <Control 
                placeholder="Search tags..." 
                onChange={e => setFilter(e.target.value)}
                value={filter}
              />
            </Input>
            <Button type="submit">
              <Filter className="size-3" />
              Apply filters
            </Button>
          </form>

          <Button>
            <FileDown className="size-3" />
            Export
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Amount of videos</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-6 animate-spin text-teal-400" />
                    <span>Carregando tags...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-red-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="size-6 text-red-400" />
                    <span className="font-medium">Erro ao conectar com o servidor</span>
                    <span className="text-xs text-zinc-500">
                      Certifique-se de que o backend está rodando com <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">npm run server</code>.
                    </span>
                    <Button onClick={() => refetch()} className="mt-2">
                      <RefreshCw className="size-3" />
                      Tentar novamente
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : tagsResponse?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                  Nenhuma tag encontrada.
                </TableCell>
              </TableRow>
            ) : (
              tagsResponse?.data.map((tag) => {
                const tagTitle = tag.title || (tag as unknown as { name?: string }).name || 'Sem título'
                return (
                  <TableRow key={tag.id}>
                    <TableCell></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{tagTitle}</span>
                        <span className="text-xs text-zinc-500">{tag.slug || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {tag.amountOfVideos ?? 0} video(s)
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {tagsResponse && tagsResponse.items > 0 && (
          <Pagination pages={tagsResponse.pages} items={tagsResponse.items} page={page} />
        )}
      </main>
    </div>
  )
}

