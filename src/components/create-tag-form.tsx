import { Check, Loader2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from "./ui/button"
import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const createTagSchema = z.object({
  title: z.string().min(3, { message: 'Minimum 3 characters.' }),
})

type CreateTagSchema = z.infer<typeof createTagSchema>

function getSlugFromString(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');
}

interface CreateTagFormProps {
  onSuccess?: () => void
}

export function CreateTagForm({ onSuccess }: CreateTagFormProps) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, reset, formState } = useForm<CreateTagSchema>({
    resolver: zodResolver(createTagSchema),
  })

  const slug = watch('title') 
    ? getSlugFromString(watch('title')) 
    : ''

  const { mutateAsync } = useMutation({
    mutationFn: async ({ title }: CreateTagSchema) => {
      const response = await fetch('http://localhost:3333/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          amountOfVideos: 0,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao cadastrar a tag.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['get-tags'],
      })
      reset()
      onSuccess?.()
    }
  })

  async function createTag({ title }: CreateTagSchema) {
    await mutateAsync({ title })
  }

  return (
    <form onSubmit={handleSubmit(createTag)} className="w-full space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium block" htmlFor="title">Tag name</label>
        <input 
          {...register('title')}
          id="title" 
          type="text" 
          placeholder="Ex: React, Node.js"
          className="border border-zinc-800 rounded-lg px-3 py-2.5 bg-zinc-800/50 w-full text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
        />
        {formState.errors?.title && (
          <p className="text-sm text-red-400">{formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block" htmlFor="slug">Slug</label>
        <input 
          id="slug" 
          type="text" 
          readOnly 
          value={slug}
          placeholder="Gerado automaticamente"
          className="border border-zinc-800 rounded-lg px-3 py-2 bg-zinc-800/50 w-full text-sm text-zinc-400 cursor-not-allowed"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Dialog.Close asChild>
          <Button type="button">
            <X className="size-3" />
            Cancel
          </Button>
        </Dialog.Close>
        <Button disabled={formState.isSubmitting} className="bg-teal-400 text-teal-950 font-medium hover:bg-teal-500" type="submit">
          {formState.isSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          Save
        </Button>
      </div>
    </form>
  )
}