import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppLink(phone: string, text: string = ""): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`
  }
  const encodedText = encodeURIComponent(text)
  return encodedText ? `https://wa.me/${cleaned}?text=${encodedText}` : `https://wa.me/${cleaned}`
}

