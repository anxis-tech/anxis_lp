import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Retorno do Pagamento | ANXIS Tecnologia',
  description: 'Confirmação e processamento do pagamento via InfinitePay',
}

export default function PagamentoRetornoPage() {
  return (
    <div className="min-h-screen bg-[#081D3A] text-white flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#0C2447] border border-slate-700/60 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        {/* LOGO */}
        <div className="flex justify-center mb-2">
          <Image
            src="/images/Icon--Colorido.png"
            alt="ANXIS Logo"
            width={80}
            height={80}
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* STATUS ICON */}
        <div className="w-16 h-16 bg-[#0075FF]/20 text-[#0075FF] rounded-full flex items-center justify-center mx-auto border border-[#0075FF]/40 animate-pulse">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* MESSAGE */}
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white">Retorno de Pagamento Recebido</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Recebemos o retorno do pagamento e estamos confirmando a transação com a operadora.
          </p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Confirmação em Andamento</p>
          <p>
            Assim que a validação oficial da InfinitePay for concluída, o status do seu projeto será atualizado automaticamente em nosso sistema.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block w-full py-3 px-6 rounded-xl bg-[#0075FF] hover:bg-[#168CFF] text-white font-bold text-xs transition-all shadow-lg"
          >
            Voltar ao Site Principal
          </Link>
        </div>
      </div>
    </div>
  )
}
