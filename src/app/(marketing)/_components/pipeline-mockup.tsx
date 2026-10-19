// Ilustração do funil (kanban) feita em HTML/CSS: nítida em qualquer tela,
// sem imagem para baixar. Dados fictícios, apenas ilustrativos.

const COLUMNS = [
  {
    title: "Novo lead",
    tone: "bg-sky-500",
    cards: [
      { name: "Mariana S.", detail: "Apto 2 dorm. · Pinheiros", tag: "Portal", wait: "há 4 min" },
      { name: "Rafael T.", detail: "Casa · até R$ 900 mil", tag: "Site", wait: "há 12 min" },
    ],
  },
  {
    title: "Em atendimento",
    tone: "bg-amber-500",
    cards: [
      { name: "Juliana P.", detail: "Locação · Moema", tag: "WhatsApp", wait: "retornar hoje" },
    ],
  },
  {
    title: "Visita",
    tone: "bg-violet-500",
    cards: [
      { name: "Carlos M.", detail: "Sáb. 10h · Cobertura", tag: "Indicação", wait: "confirmada" },
    ],
  },
  {
    title: "Proposta",
    tone: "bg-emerald-500",
    cards: [
      { name: "Fernanda L.", detail: "R$ 640 mil · 3 dorm.", tag: "Portal", wait: "em análise" },
    ],
  },
];

export function PipelineMockup() {
  return (
    <div
      role="img"
      aria-label="Exemplo do funil de vendas com leads organizados em etapas: novo lead, em atendimento, visita e proposta."
      className="border-border bg-surface relative rounded-2xl border p-3 shadow-2xl shadow-emerald-900/10 sm:p-4"
    >
      <div className="mb-3 flex items-center gap-1.5 px-1" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="text-muted-foreground ml-3 text-xs font-medium">Funil · Vendas</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" aria-hidden="true">
        {COLUMNS.map((column, index) => (
          <div
            key={column.title}
            className={
              index > 1 ? "bg-muted hidden rounded-xl p-2 lg:block" : "bg-muted rounded-xl p-2"
            }
          >
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className={`size-2 rounded-full ${column.tone}`} />
              <span className="truncate text-xs font-semibold">{column.title}</span>
              <span className="text-muted-foreground ml-auto text-xs">{column.cards.length}</span>
            </div>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <div
                  key={card.name}
                  className="border-border bg-surface rounded-lg border p-2.5 shadow-xs"
                >
                  <p className="text-xs font-semibold">{card.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{card.detail}</p>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                      {card.tag}
                    </span>
                    <span className="text-muted-foreground truncate text-[10px]">{card.wait}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="border-border bg-surface absolute -bottom-5 left-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs shadow-lg sm:left-8"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" />
          </svg>
        </span>
        <span>
          <strong className="font-semibold">Mariana</strong> respondida no WhatsApp em 2 min
        </span>
      </div>
    </div>
  );
}
