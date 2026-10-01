import type { Hazard } from './risk';

export type FloodEvent = { date: string; text: string; url: string };
export type Area = {
	id: string;
	name: string;
	short: string;
	hazard: Hazard;
	lat: number;
	lon: number;
	gauges: string[];
	events: FloodEvent[];
};
export type Shelter = { name: string; address: string; lat: number; lon: number };
export type Contact = { label: string; detail: string; href: string };

export const AREAS: Area[] = [
	{
		id: 'canal-do-fragoso',
		name: 'Canal do Fragoso',
		short: 'Jardim Fragoso',
		hazard: 'inundacao',
		lat: -7.9787,
		lon: -34.8543,
		gauges: ['260960004A', '261070705A', '261160614A'],
		events: [
			{ date: '2026-05-01', text: '184 a 188 mm em 24 horas. Canal transbordou e moradores ficaram ilhados.', url: 'https://portaldeprefeitura.com.br/regiao-metropolitana/olinda/olinda-canal-do-fragoso-transborda-moradores-ilhados-alagada/620436/' },
			{ date: '2026-04-07', text: 'Canal transbordou. Bombeiros resgataram cerca de 10 pessoas.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711643-chuva-em-olinda-canal-do-fragoso-transborda-e-cerca-de-10-pessoas-sao-resgatadas-pelos-bombeiros.html' },
			{ date: '2026-04-01', text: '126 mm em 12 horas. Transbordou na Rua Olímpio Magalhães.', url: 'https://www.folhape.com.br/noticias/chuvas-olinda-canal-fragoso-transborda/477742/' },
			{ date: '2025-05-15', text: 'Mais de 143 mm em 24 horas. Alagou a Av. Getúlio Vargas e a Rua Catulo da Paixão Cearense.', url: 'https://www.folhape.com.br/noticias/chuvas-canal-do-fragoso-transborda-em-olinda-ruas-da-cidade-ficam/411359/' },
			{ date: '2025-02-05', text: 'Canal transbordou e a água entrou nas casas.', url: 'https://www.folhape.com.br/noticias/canal-do-fragoso-em-olinda-transborda-por-causa-das-fortes-chuvas/389529/' },
			{ date: '2023-05-23', text: 'Casas alagadas em Jardim Atlântico. Moradores dizem que o canal transbordou.', url: 'https://www.folhape.com.br/noticias/canal-do-fragoso-transbordou-com-chuvas-dizem-moradores-governo-nega/272425/' }
		]
	},
	{
		id: 'jardim-atlantico',
		name: 'Jardim Atlântico',
		short: 'Canal do Fragoso, trecho baixo',
		hazard: 'inundacao',
		lat: -7.9768,
		lon: -34.8366,
		gauges: ['260960004A', '261070705A', '261160614A'],
		events: [
			{ date: '2026-04-07', text: 'Canal do Fragoso transbordou; ~10 pessoas resgatadas pelos Bombeiros (Rua Catulo da Paixão Cearense / Jardim Atlântico).', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711643-chuva-em-olinda-canal-do-fragoso-transborda-e-cerca-de-10-pessoas-sao-resgatadas-pelos-bombeiros.html' },
			{ date: '2026-04-01', text: 'Olinda >126 mm em 12 h (APAC); Canal do Fragoso transbordou na Rua Professor Olímpio Magalhães (Jardim Atlântico); prefeitura passou de \'observação\' para \'atenção\'.', url: 'https://www.folhape.com.br/noticias/chuvas-olinda-canal-fragoso-transborda/477742/' },
			{ date: '2025-05-15', text: 'Canal do Fragoso transbordou; pluviômetro Jardim Fragoso >143 mm em 24 h; alagadas Av. Getúlio Vargas, Rua Catulo da Paixão Cearense e Rua Olegário Mariano.', url: 'https://www.folhape.com.br/noticias/chuvas-canal-do-fragoso-transborda-em-olinda-ruas-da-cidade-ficam/411359/' }
		]
	},
	{
		id: 'rio-doce-1a-etapa',
		name: 'Rio Doce',
		short: '1ª etapa e V8',
		hazard: 'inundacao',
		lat: -7.9636,
		lon: -34.8325,
		gauges: ['261070705A', '260960004A', '261160614A'],
		events: [
			{ date: '2026-05-04', text: '118 pessoas abrigadas; doações entregues às comunidades Tetra, V8, Salgadinho e Fragoso; abrigos em Peixinhos e Vila Olímpica de Rio Doce.', url: 'https://www.olinda.pe.gov.br/chuvas-abrigos-de-olinda-arrecadam-alimentos-e-fornecem-refeicoes/' },
			{ date: '2026-04-07', text: 'Alagamentos em Jardim Fragoso (água na cintura), Casa Caiada, Peixinhos (Av. Presidente Kennedy, Rua Armindo Cardozo Moura), Varadouro (Rua Waldemar Paulino dos Santos, Canal da Malária); Canal do Fragoso transbordou na altura da 1ª etapa de Rio Doce.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711621-chuvas-provocam-diversos-pontos-de-alagamento-na-regiao-metropolitana-do-recife.html' }
		]
	},
	{
		id: 'ouro-preto',
		name: 'Ouro Preto',
		short: 'Canal Ouriço do Mar',
		hazard: 'inundacao',
		lat: -7.9939,
		lon: -34.8597,
		gauges: ['260960004A', '261160614A', '261160616G'],
		events: [
			{ date: '2026-05-01', text: 'Ouro Preto foi o bairro com mais chuva em Olinda (93 mm/24 h, APAC); vários pontos de alagamento e vias interditadas.', url: 'https://portaldeprefeitura.com.br/pernambuco/em-olinda-ouro-preto-foi-o-bairro-onde-mais-choveu-nas-ultimas-24/620452/' },
			{ date: '2026-05-01', text: 'Três abrigos abertos (Peixinhos, Jatobá/Ouro Preto, Rio Doce); bairros afetados: Passarinho, Águas Compridas, Peixinhos, Jatobá, Rio Doce.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11713378-olinda-disponibiliza-tres-abrigos-para-moradores-afetados-pelas-chuvas.html' }
		]
	},
	{
		id: 'peixinhos-beberibe',
		name: 'Peixinhos',
		short: 'Rio Beberibe e Canal Lava Tripas',
		hazard: 'inundacao',
		lat: -8.0138,
		lon: -34.8721,
		gauges: ['261160614A', '261160616G', '261160623A'],
		events: [
			{ date: '2026-05-01', text: 'Rio Beberibe subiu rápido e invadiu casas em Peixinhos (água no pescoço); bebês resgatados em bacia.', url: 'https://portaldeprefeitura.com.br/pernambuco/olinda-bebe-e-resgatada-de-alagamento-em-bacia-durante-temporal-casa/620659/' },
			{ date: '2026-04-07', text: 'Alagamentos em Jardim Fragoso (água na cintura), Casa Caiada, Peixinhos (Av. Presidente Kennedy, Rua Armindo Cardozo Moura), Varadouro (Rua Waldemar Paulino dos Santos, Canal da Malária); Canal do Fragoso transbordou na altura da 1ª etapa de Rio Doce.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711621-chuvas-provocam-diversos-pontos-de-alagamento-na-regiao-metropolitana-do-recife.html' }
		]
	},
	{
		id: 'varadouro-canal-malaria',
		name: 'Varadouro',
		short: 'Canal da Malária',
		hazard: 'inundacao',
		lat: -8.0144,
		lon: -34.8568,
		gauges: ['261160614A', '260960004A', '261160623A'],
		events: [
			{ date: '2026-04-07', text: 'Alagamentos em Jardim Fragoso (água na cintura), Casa Caiada, Peixinhos (Av. Presidente Kennedy, Rua Armindo Cardozo Moura), Varadouro (Rua Waldemar Paulino dos Santos, Canal da Malária); Canal do Fragoso transbordou na altura da 1ª etapa de Rio Doce.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711621-chuvas-provocam-diversos-pontos-de-alagamento-na-regiao-metropolitana-do-recife.html' }
		]
	},
	{
		id: 'casa-caiada',
		name: 'Casa Caiada',
		short: 'Canais da orla',
		hazard: 'inundacao',
		lat: -7.9847,
		lon: -34.8383,
		gauges: ['260960004A', '261070705A', '261160614A'],
		events: [
			{ date: '2026-04-07', text: 'Alagamentos em Jardim Fragoso (água na cintura), Casa Caiada, Peixinhos (Av. Presidente Kennedy, Rua Armindo Cardozo Moura), Varadouro (Rua Waldemar Paulino dos Santos, Canal da Malária); Canal do Fragoso transbordou na altura da 1ª etapa de Rio Doce.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711621-chuvas-provocam-diversos-pontos-de-alagamento-na-regiao-metropolitana-do-recife.html' }
		]
	},
	{
		id: 'alto-da-bondade-passarinho',
		name: 'Alto da Bondade',
		short: 'Passarinho',
		hazard: 'deslizamento',
		lat: -7.9866,
		lon: -34.9108,
		gauges: ['260960001A', '261160605A', '261160616G'],
		events: [
			{ date: '2026-05-07', text: 'A barreira fatal estava mapeada como R4 (risco muito alto) no PMRR Olinda (UFPE/MCid, publicado ago/2025; alerta preliminar à prefeitura no 1º tri 2025).', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11713768-estudo-alertou-ha-mais-de-um-ano-sobre-alto-risco-de-deslizamento-de-barreira-que-matou-mae-e-bebe-em-olinda.html' },
			{ date: '2026-05-01', text: 'Deslizamento entre Alto da Bondade e Passarinho destruiu 5 casas; mãe (20) e bebê (6 meses) morreram. Outros deslizamentos: 2 no Alto da Bondade e 1 na Estrada do Passarinho. Olinda ~188 mm/24 h.', url: 'https://portaldeprefeitura.com.br/clima/olinda-deslizamento-destroi-cinco-casas-deixa-mae-e-bebe/620429/' },
			{ date: '2026-05-01', text: 'Deslizamentos em Passarinho e Águas Compridas (sem vítimas); Olinda 177 mm/24 h.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11713349-chuvas-causam-mais-dois-deslizamentos-de-barreiras-em-olinda.html' }
		]
	},
	{
		id: 'aguas-compridas',
		name: 'Águas Compridas',
		short: 'Córrego do Abacate',
		hazard: 'deslizamento',
		lat: -7.9906,
		lon: -34.8976,
		gauges: ['260960001A', '261160616G', '261160614A'],
		events: [
			{ date: '2026-05-01', text: 'Deslizamentos em Passarinho e Águas Compridas (sem vítimas); Olinda 177 mm/24 h.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11713349-chuvas-causam-mais-dois-deslizamentos-de-barreiras-em-olinda.html' },
			{ date: '2026-04-12', text: 'Barreira deslizou na Rua Oito de Maio, Águas Compridas; 4 casas interditadas.', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711991-barreira-desliza-em-aguas-compridas-em-olinda-e-defesa-civil-avalia-interdicao-de-casas.html' },
			{ date: '2026-04-07', text: 'Prefeitura: ~130 mm acumulados (APAC), alerta máximo, 5 deslizamentos em Águas Compridas, deslizamentos em Fragoso e Alto Nova Olinda, muro desabou em Jardim Fragoso; sem vítimas.', url: 'https://www.olinda.pe.gov.br/noticias/defesa-civil-de-olinda-age-rapido-e-garante-resposta-eficiente-as-ocorrencias-provocadas-pelas-chuvas' },
			{ date: '2022-05-25', text: 'Deslizamentos: 1 morto no Córrego do Abacate (Águas Compridas); casal desaparecido no Córrego do Abacaxi, Rua Mirueira (Caixa d\'Água).', url: 'https://www.folhape.com.br/noticias/homem-morre-em-deslizamentos-de-barreiras-em-olinda/228061/' }
		]
	},
	{
		id: 'caixa-dagua-corrego-abacaxi',
		name: 'Caixa d\'Água',
		short: 'Córrego do Abacaxi',
		hazard: 'deslizamento',
		lat: -7.9962,
		lon: -34.9038,
		gauges: ['261160616G', '260960001A', '261160613A'],
		events: [
			{ date: '2022-05-25', text: 'Deslizamentos: 1 morto no Córrego do Abacate (Águas Compridas); casal desaparecido no Córrego do Abacaxi, Rua Mirueira (Caixa d\'Água).', url: 'https://www.folhape.com.br/noticias/homem-morre-em-deslizamentos-de-barreiras-em-olinda/228061/' }
		]
	},
	{
		id: 'alto-sol-nascente',
		name: 'Alto do Sol Nascente',
		short: 'Estrada da Mirueira',
		hazard: 'deslizamento',
		lat: -7.9799,
		lon: -34.9051,
		gauges: ['260960001A', '261160616G', '261160605A'],
		events: [
			{ date: '2025-05-15', text: 'Desabamento parcial de barreira na Rua Egipson, 45, Alto Sol Nascente (Estrada da Mirueira), sem feridos.', url: 'https://www.olinda.pe.gov.br/boletim-de-monitoramento-das-chuvas-em-olinda-14-e-15-de-maio-de-2025/' }
		]
	},
	{
		id: 'alto-nova-olinda',
		name: 'Alto Nova Olinda',
		short: 'Morro',
		hazard: 'deslizamento',
		lat: -7.9925,
		lon: -34.8923,
		gauges: ['261160616G', '260960001A', '261160614A'],
		events: [
			{ date: '2026-04-07', text: 'Prefeitura: ~130 mm acumulados (APAC), alerta máximo, 5 deslizamentos em Águas Compridas, deslizamentos em Fragoso e Alto Nova Olinda, muro desabou em Jardim Fragoso; sem vítimas.', url: 'https://www.olinda.pe.gov.br/noticias/defesa-civil-de-olinda-age-rapido-e-garante-resposta-eficiente-as-ocorrencias-provocadas-pelas-chuvas' }
		]
	},
	{
		id: 'aguazinha',
		name: 'Aguazinha',
		short: 'Morro',
		hazard: 'deslizamento',
		lat: -8.0011,
		lon: -34.8842,
		gauges: ['261160614A', '261160616G', '260960001A'],
		events: []
	},
	{
		id: 'alto-da-conquista',
		name: 'Alto da Conquista',
		short: 'Morro',
		hazard: 'deslizamento',
		lat: -7.9815,
		lon: -34.8997,
		gauges: ['260960001A', '261160616G', '261160605A'],
		events: []
	}
];

export const SHELTERS: Shelter[] = [
	{ name: 'EREF Monsenhor Arruda Câmara', address: 'Av. Nacional, 345, Peixinhos', lat: -8.0134, lon: -34.8761 },
	{ name: 'Escola Argentina Castello Branco', address: 'Av. Dr. Joaquim Nabuco, s/n, Jatobá (OSM: Ouro Preto)', lat: -8.0003, lon: -34.8569 },
	{ name: 'Vila Olímpica de Rio Doce', address: 'Av. Brasil, s/n, Rio Doce', lat: -7.9583, lon: -34.8472 }
];

export const CONTACTS: Contact[] = [
	{ label: 'Defesa Civil de Olinda, 24 horas', detail: '0800 081 0060', href: 'tel:08000810060' },
	{ label: 'WhatsApp da Defesa Civil', detail: '(81) 99266-5307', href: 'https://wa.me/5581992665307' },
	{ label: 'Bombeiros', detail: '193', href: 'tel:193' },
	{ label: 'Defesa Civil nacional', detail: '199', href: 'tel:199' }
];

export const byId = (id: string | null) => AREAS.find((a) => a.id === id) ?? null;
