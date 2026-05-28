# Modo Offline Implementado! 📱⚡

A aplicação "StockFlow" tem agora capacidades avançadas de **Progressive Web App (PWA)** e suporte para **Modo Offline**, tornando-a incrivelmente robusta para ambientes de armazém com fraca rede.

## O que foi feito:

### 1. Transformação em PWA
- Configurámos o `vite-plugin-pwa` (Workbox) que regista um *Service Worker*.
- A app passa agora a guardar a interface gráfica (HTML, JS, CSS) em cache.
- Pode ser "Instalada" no Ecrã Principal (Add to Home Screen) de smartphones iOS e Android, ganhando um aspeto de aplicação nativa (sem barra de endereço).

### 2. Sincronização Inteligente (IndexedDB)
- Sempre que a aplicação é aberta e há internet, fazemos um *download invisível* (em pano de fundo) do catálogo de **Produtos**, localizações de **Armazéns** e **Inventário**.
- Estes dados são guardados localmente no telemóvel usando o *Dexie*.

### 3. O Scanner à prova de quebras de rede
- **Leitura Offline:** Se a internet for abaixo, podes continuar a ler QR Codes de prateleiras e Códigos de Barras de produtos. O Scanner passa automaticamente a ler da base de dados local!
- **Movimentos em Fila de Espera:** Quando registas uma Entrada ou Saída sem rede, o movimento é guardado na aba de "Operações Pendentes" (fila local).
- **Auto-Sync:** Mal o telemóvel detete novamente ligação à internet, a app envia todos os movimentos pendentes para a nuvem de forma automática!

### 4. Bloqueio Seguro de Criação
Como acordámos, se o scanner detetar um código de barras novo (desconhecido) e o telemóvel estiver offline, vai apresentar um alerta amigável e impedir a criação do produto. Isto evita corrupção de dados e conflitos de IDs quando os utilizadores se voltarem a ligar.

---

> [!TIP]
> **Como testar no computador:**
> Podes testar o modo offline agora mesmo! 
> 1. Abre a página do Scanner.
> 2. Vai às Ferramentas de Programador do teu browser (F12) -> Tab "Network".
> 3. Altera a opção de "No throttling" para **"Offline"**.
> 4. O ícone do WiFi no cabeçalho vai ficar vermelho e podes tentar simular leituras manuais ou criar movimentos!
