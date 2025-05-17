# Village Notifier

## Configuration

You can edit the regular expressions that trigger notifications in `config.json`.  
You must define a `.env` file with your variables. There is an `.env.example` that you can copy.

## Running

### Normie

Ask your favorite LLM how to install the tools to make it run on your operating system.  
Paste your errors, give him information about your system and it will go fine.

### Native
You will need [Bun](https://bun.sh/)
```bash
make install
make run
```

### Using Docker
You will need [Docker](https://docker.com/).
```bash
make docker-build
make docker-run
```


This project was created using `bun init` in bun v1.2.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
