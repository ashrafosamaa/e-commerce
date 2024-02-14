import { customAlphabet } from 'nanoid'

const generateUniqueString = (length) => {
    const nanoid = customAlphabet('12345abcd', length || 10)
    return nanoid()
}

export default generateUniqueString