import { FormEvent } from 'react'
import { ChatMessage } from './PermaChat'
import './RegistrationForm.scss'

interface RegistrationFormProps {
  chatMessage: ChatMessage
  setChatMessage: (chatMessage: ChatMessage) => void
  onRegistration: (e: FormEvent) => void
}

function RegistrationForm(props: RegistrationFormProps) {
  const { chatMessage, setChatMessage, onRegistration: handleRegistration } = props
  return (
    <form className="registration-form border p-4 shadow-sm">
      <h4>Register</h4>
      <div className="d-flex gap-3 mt-3">
        <label htmlFor="username" className="visually-hidden">
          Username
        </label>
        <input
          id="username"
          className="form-control"
          type="text"
          placeholder="Enter your name"
          autoComplete="false"
          value={chatMessage.sender}
          onChange={(e) => setChatMessage({ ...chatMessage, sender: e.target.value })}
        />
        <button
          className="btn btn-primary"
          type="submit"
          onClick={handleRegistration}
          disabled={chatMessage.sender.length < 1}
        >
          Register
        </button>
      </div>
    </form>
  )
}

export default RegistrationForm
