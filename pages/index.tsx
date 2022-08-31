import type { NextPage } from 'next'
import { FormEvent, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {

  const { signIn } = useAuth()

  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const handleSubmit = async(e: FormEvent) => {
    e.preventDefault()

    const data = {
      email,
      password
    }

    await signIn(data)
  }

  return (
    <form className={styles.container} onSubmit={ handleSubmit }>
      <input type="e-mail" value={email} onChange={ e => setEmail(e.target.value)}/>
      <input type="password" value={password} onChange={ e => setPassword(e.target.value)}/>
      <button type="submit">Entrar</button>
    </form>
  )
}

export default Home
