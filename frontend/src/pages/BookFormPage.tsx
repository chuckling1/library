import React from 'react'
import { useParams } from 'react-router-dom'

const BookFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)

  return (
    <div>
      <h2>{isEditing ? 'Edit Book' : 'Add New Book'}</h2>
      <p>Book form will be implemented here. This is a placeholder component.</p>
      <div className="card">
        <h3>Coming Soon</h3>
        <ul>
          <li>Title and Author inputs</li>
          <li>Genre selector with autocomplete</li>
          <li>Star rating selector</li>
          <li>Date picker for published date</li>
          <li>Edition and ISBN fields</li>
          <li>Form validation</li>
          <li>OpenAPI-generated client integration</li>
        </ul>
      </div>
    </div>
  )
}

export default BookFormPage