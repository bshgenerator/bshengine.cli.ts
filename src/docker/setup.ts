import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '@src/logger';
import { fileExists } from '@utils/files';

const DOCKER_COMPOSE_CONTENT = `services:
  backend:
    image: 'bshg/engine:latest'
    container_name: 'engine-backend'
    ports:
      - '7071:7071'
    env_file:
      - .env
    depends_on:
      - postgres
    networks:
      - engine-net
 
  postgres:
    image: 'postgres:latest'
    container_name: 'engine-postgres'
    environment:
      - 'POSTGRES_DB=engine'
      - 'POSTGRES_PASSWORD=password'
      - 'PGDATA=/var/lib/postgresql/data'
      - 'POSTGRES_USER=engine'
    ports:
      - '5432:5432'
    volumes:
      - ./data/engine-postgres-data:/var/lib/postgresql/data
    networks:
      - engine-net
 
networks:
  engine-net:
    name: engine-net
    driver: bridge
 
volumes:
  engine-postgres-data:
`;

const ENV_CONTENT = `BSH_DB_URL=jdbc:postgresql://engine-postgres:5432/engine
BSH_DB_USER=engine
BSH_DB_PASSWORD=password
BSH_DB_DRIVER=org.postgresql.Driver
 
BSH_PORT=7071 # optional
BSH_FRONTEND_HOST=http://localhost:*
 
BSH_ADMIN_USERNAME=admin@engine.com
BSH_ADMIN_PASSWORD=password
`;

const ENV_EXAMPLE_CONTENT = `BSH_DB_URL=jdbc:postgresql://
BSH_DB_USER=
BSH_DB_PASSWORD=
BSH_DB_DRIVER=org.postgresql.Driver
 
BSH_PORT= # optional
BSH_FRONTEND_HOST=
 
BSH_ADMIN_USERNAME=
BSH_ADMIN_PASSWORD=
`;

export type SetupCommandOptions = {
  force?: boolean;
  outputDir?: string;
}

async function generateDockerEnv(options: SetupCommandOptions): Promise<void> {
  const outputDir = options.outputDir || '.';
  const force = options.force || false;

    const files = [
      { name: 'docker-compose.yml', content: DOCKER_COMPOSE_CONTENT },
      { name: '.env', content: ENV_CONTENT },
      { name: '.env.example', content: ENV_EXAMPLE_CONTENT },
    ];

  logger.info('Setting up BSH Engine Docker configuration...');

  for (const file of files) {
    const filePath = join(outputDir, file.name);
    const exists = await fileExists(filePath);

    if (exists && !force) {
      logger.warn(`File ${file.name} already exists. Use --force to overwrite.`);
      continue;
    }

    writeFileSync(filePath, file.content, 'utf-8');
    logger.info(`Created ${file.name}`);
  }
}

export function createSetupCommand(): Command {
  const command = new Command('setup')
    .alias('s')
    .description('Setup Docker Compose and environment files for BSH Engine');

  command
    .option('-f, --force', 'Overwrite existing files')
    .option('-o, --output-dir <dir>', 'Output directory (default: current directory)', '.');

  command.action(async (options: SetupCommandOptions) => {
    try {
      await generateDockerEnv(options);
    } catch (error) {
      logger.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

  return command;
}
