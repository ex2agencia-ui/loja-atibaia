export function Footer() {
  return (
    <footer className="hidden md:flex items-center justify-center gap-1.5 py-3 text-xs border-t border-neutral-800 bg-black shrink-0">
      <span className="text-white/80">&copy; {new Date().getFullYear()} Loja Itapetinga. Todos os direitos reservados.</span>
      <span className="text-white/40">|</span>
      <span className="text-white/80">
        Desenvolvido por{" "}
        <span className="text-white font-medium">SynapseIQ</span>
      </span>
    </footer>
  )
}
