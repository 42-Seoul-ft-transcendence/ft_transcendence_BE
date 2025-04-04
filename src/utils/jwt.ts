import jwt from 'jsonwebtoken'

const JWT_SECRET = 'your_jwt_secret'

export function generateAccessToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}
