# Site Escoteiro

Site institucional para Grupo Escoteiro com design moderno, responsivo e atraente.

## 🎨 Características

- **Design Moderno**: Interface limpa e profissional com cores azul bebê, azul marinho e branco
- **Totalmente Responsivo**: Funciona perfeitamente em dispositivos móveis, tablets e desktops
- **Páginas Separadas**: Organização clara com páginas dedicadas para cada tópico
- **Galeria de Fotos**: Sistema de galeria com filtros por categoria
- **Formulário de Contato**: Formulário funcional para receber mensagens
- **Navegação Intuitiva**: Menu de navegação com animações suaves

## 📄 Páginas

- **index.html**: Página inicial com hero section e visão geral
- **sobre.html**: Informações sobre o escotismo e o grupo
- **atividades.html**: Detalhes sobre as atividades realizadas
- **galeria.html**: Galeria de fotos com filtros
- **ramo.html**: Informações sobre os diferentes ramos escoteiros
- **contato.html**: Formulário de contato e informações

## 🎨 Cores

- **Azul Bebê**: #87CEEB
- **Azul Marinho**: #001F3F
- **Branco**: #FFFFFF

## 🚀 Como Usar

1. Abra o arquivo `index.html` em um navegador web
2. Navegue pelas diferentes páginas através do menu
3. Personalize o conteúdo substituindo os textos e adicionando suas próprias fotos

## 📸 Adicionando Fotos

Para adicionar fotos, substitua os elementos `.image-placeholder` por tags `<img>`:

```html
<img src="caminho/para/sua/foto.jpg" alt="Descrição da foto">
```

### Carrossel (hero)

O carrossel da página inicial lê imagens a partir do atributo `data-hero-images` na tag `section.hero`.
Para trocar as imagens apenas:

1. Coloque seus arquivos dentro da pasta `images/` (ex.: `images/hero1.jpg`, `images/hero2.jpg`).
2. Abra `index.html` e edite o atributo `data-hero-images` para os nomes desejados, separados por vírgula:

```html
<section class="hero" data-hero-images="images/hero1.jpg, images/hero2.jpg" data-hero-interval="15000">
```

3. (Opcional) Ajuste `data-hero-interval` com o tempo em milissegundos entre as trocas.

O carrossel suporta imagens com `object-fit: cover`; use imagens com proporções semelhantes para melhor resultado.

## 📱 Responsividade

O site é totalmente responsivo e se adapta automaticamente a:
- Smartphones (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3 (com Grid e Flexbox)
- JavaScript (Vanilla)
- Font Awesome (ícones)

## 📝 Personalização

Você pode personalizar facilmente:
- Cores no arquivo `style.css` (variáveis CSS no topo)
- Conteúdo nas páginas HTML
- Fotos substituindo os placeholders
- Informações de contato na página de contato

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através do formulário na página de contato.

---

**Sempre Alerta para Servir!** 🏕️
