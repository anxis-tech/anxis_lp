import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppLink(phone: string, text: string = ""): string {
  const cleaned = phone.replace(/\D/g, "")
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleaned}?text=${encodedText}`
}
