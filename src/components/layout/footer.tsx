export function Footer() {
  return (
    <footer className="hidden md:flex items-center justify-center gap-1.5 py-3 text-xs border-t border-[#4a6d96] bg-[#597ea9] shrink-0">
      <span className="text-white/80">&copy; {new Date().getFullYear()} Loja Itapetininga. Todos os direitos reservados.</span>
      <span className="text-white/40">|</span>
      <span className="text-white/80">
        Desenvolvido por{" "}
        <span className="text-white font-medium">SynapseIQ</span>
      </span>
    </footer>
  )
}
