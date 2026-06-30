'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Todo } from '@/lib/types'

export default function TodoApp() {
  const { session } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newText, setNewText] = useState('')
  const userId = session?.user.id

  useEffect(() => {
    fetchTodos()

    const channel = supabase
      .channel('todos-changes')
      .on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'todos',
  },
  (payload) => {
    if (payload.eventType === 'INSERT') {
      setTodos((prev) => [...prev, payload.new as Todo])
    }

    if (payload.eventType === 'UPDATE') {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === payload.new.id ? (payload.new as Todo) : t
        )
      )
    }

    if (payload.eventType === 'DELETE') {
      setTodos((prev) =>
        prev.filter((t) => t.id !== payload.old.id)
      )
    }
  }
)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTodos = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setTodos(data)
  }

const addTodo = async () => {
  if (!newText.trim() || !userId) return

  const { data, error } = await supabase
    .from('todos')
    .insert({
      text: newText.trim(),
      user_id: userId,
    })
    .select()

  console.log('INSERT RESULT:', { data, error })

  if (error) {
    alert(error.message)
    return
  }

  setNewText('')
  fetchTodos()
}

  const toggleTodo = async (todo: Todo) => {
    await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id)
  }

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id)
  }

  const mine = todos.filter((t) => t.user_id === userId)
  const theirs = todos.filter((t) => t.user_id !== userId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/50"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          Add
        </button>
      </div>

      <TodoColumn title="Mine" todos={mine} onToggle={toggleTodo} onDelete={deleteTodo} />
      <TodoColumn title="Theirs" todos={theirs} onToggle={toggleTodo} onDelete={deleteTodo} />
    </div>
  )
}

function TodoColumn({
  title,
  todos,
  onToggle,
  onDelete,
}: {
  title: string
  todos: Todo[]
  onToggle: (t: Todo) => void
  onDelete: (id: string) => void
}) {
  const done = todos.filter((t) => t.completed).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/70 text-sm font-medium uppercase tracking-wide">{title}</h3>
        <span className="text-white/40 text-xs">
          {done}/{todos.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              <button
                onClick={() => onToggle(todo)}
                className={`w-5 h-5 rounded-full border flex-shrink-0 transition-colors ${
                  todo.completed ? 'bg-emerald-400 border-emerald-400' : 'border-white/40'
                }`}
              />
              <span
                className={`flex-1 text-sm ${
                  todo.completed ? 'line-through text-white/30' : 'text-white/90'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => onDelete(todo.id)}
                className="text-white/20 hover:text-white/60 text-xs transition-colors"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {todos.length === 0 && (
          <p className="text-white/30 text-sm italic">Nothing here yet.</p>
        )}
      </div>
    </div>
  )
}