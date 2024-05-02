import { createState } from '@graph-state/core'
import { generateId } from '../helpers'

export const mockAuthor = {
  _type: 'Author',
  _id: '20',
  name: 'John Doe',
  key: '100',
}

export const mockPost = {
  _type: 'Post',
  _id: '0',
  title: 'Post title',
  description:
    'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
  author: mockAuthor,
}

export const mockGraphState = () =>
  createState({
    keys: {
      Author: author => author.key,
    },
    initialState: {
      _type: 'Root',
      _id: generateId(),
      posts: [mockPost],
    },
  })
