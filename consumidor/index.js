const express = require('express');
const amqp = require('amqplib');
const fetch = require('node-fetch');
const dotenv = require('dotenv')
const { Pool } = require('pg')

//config do dotenv -variaveis de ambiente
dotenv.config();

const pool = new Pool({
  user: 'postgres',
  host: 'trabalhotopicos_sd-db-1',
  database: 'TrabalhoTopicos_DB',
  password: 'example',
  port: '5432',
})

const app = express();

const AMQP_URL = 'amqp://admin:admin@rabbitmq:5672'; // URL de conexão do RabbitMQ

app.get('/', async (req, res) => {
  try {
    // Conecta ao RabbitMQ
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();

    const queue = 'fila'; // Nome da fila que será consumida

    // Declara a fila para garantir que ela exista
    await channel.assertQueue(queue);

    // Consome a fila
    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        console.log('Mensagem recebida:', msg.content.toString());

        // Realiza o processamento necessário com a mensagem
        try {
          const response = await fetch(`https://brasilapi.com.br/api/banks/v1/${msg.content.toString()}`);
          if (response.ok) {
            const data = await response.json();
            console.log(data);

            // Insere os dados no PostgreSQL
            const insertQuery = `
              INSERT INTO banks (ispb, name, code, fullName)
              VALUES ($1, $2, $3, $4)
            `;
            const values = [
              data.ispb,           
              data.name,
              data.code,
              data.fullName
            ];

          await pool.query(insertQuery, values);
          console.log('Dados inseridos no PostgreSQL com sucesso!');

          } else {
            console.log('Erro na requisição:', response.status);
          }
        } catch (error) {
          console.log('Erro na requisição:', error);
        }

        // Confirma o processamento da mensagem
        channel.ack(msg);
      }
    });

    console.log('Consumidor de RabbitMQ iniciado');
    res.send('Consumidor de RabbitMQ iniciado');
  } catch (error) {
    console.error('Erro ao conectar ao RabbitMQ:', error);
    res.status(500).send('Erro ao conectar ao RabbitMQ');
  }
});

app.listen(8000, () => {
  console.log('Consumidor iniciado na porta 3000');
});
