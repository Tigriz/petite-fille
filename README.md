<img align="left" width="128" height="128" src="./icon.webp" alt="" />

# ​ Petite Fille

​ [![Bun](https://img.shields.io/badge/Bun-000?style=solid&logo=bun&logoColor=fff)](https://bun.sh/) [![TypeScript](https://img.shields.io/badge/Typescript-%23007ACC.svg?style=solid&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)

<br>

## Configuration

You can edit the regular expressions that trigger notifications in `config.json`.  
You must define a `.env` file with your variables. There is an `.env.example` that you can copy.

## Running

### Normie

Ask your favorite LLM how to install the tools to make it run on your operating system.  
Paste your errors, give him information about your system and it will go fine.

### Bun
You will need [Bun](https://bun.sh/)
```bash
bun i
bun run start
```

### Using Docker
You will need [Docker](https://docker.com/).
```bash
make docker-build
make docker-run
```

### Todos

- un mécanisme pour relancer le websocket quand village meurt
- filtres avancés (multiples conditions etc avec des fonctions)
- faire un truc multiconfig/multiusers?