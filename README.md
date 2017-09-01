# fatec-posso-faltar

NodeJS web scrapper para resgatar presenças dos alunos da FATEC no SIGA utilizando PhantomJS.

## Instalando

```sh
npm install --save fatec-posso-faltar
```

## Executando

É compatível com ES2015 e ES6, em Node v6.11.0:

```js
let PossoFaltar = require('fatec-posso-faltar')
let login = 'SEU_LOGIN'
let password = 'SUA_SENHA'
let classroom = 'SUA_TURMA' // A, B...
let log = true // Se deseja fazer o log das etapas, padrão é `false`
const possoFaltar = new PossoFaltar({login, password, classroom, log})
possoFaltar.verificarFaltas({day: 'today'}).then(result => {
  // Irá retornar um JSON com esta estrutura:
  // [
  //   {
  //     classroom: 'A',
  //     disciplineInitials: 'IHC001',
  //     workload: 2,
  //     name: 'Interação Humano Computador',
  //     presences: 6,
  //     absenses: 4,
  //     maxAbsences: 10,
  //     canIMiss: true
  //   }
  // ]
})
```

## Desenvolvimento

Certifique que você tem o [Node.js](http://nodejs.org/) instalado.

```sh
git clone https://github.com/filipemeneses/fatec-posso-faltar # ou faça um fork
cd fatec-posso-faltar
npm i -D
```

O ambiente deve estar pronto para desenvolvimento.
