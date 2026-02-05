import { FormEvent, useState } from 'react'
import { useAuth } from '../../../app/providers/AuthProvider'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const { error } = await updatePassword(password)
    setMsg(error ? error.message : 'Password updated! You can close this tab.')
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>Set a new password</h2>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Update password</button>
      {msg && <p>{msg}</p>}
    </form>
  )
}
