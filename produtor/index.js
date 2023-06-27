const express = require('express');
const amqp = require('amqplib');

const app = express();

const AMQP_URL = 'amqp://admin:admin@rabbitmq:5672'; // URL para conexão do RabbitMQ

app.use(express.json());

app.post('/', async (req, res) => {
  try {
    // Conexão com RabbitMQ
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();

    const queue = 'fila'; // Fila onde a mensagem será enviada
    const message = req.body.cod; // Obtém a mensagem solicitação

    // Garantir que ela exista
    await channel.assertQueue(queue);

    // Envia a mensagem para a fila
    channel.sendToQueue(queue, Buffer.from(message));

    console.log('Mensagem enviada:');
    res.send({message:'Mensagem enviada para o RabbitMQ'});
  } catch (error) {
    console.error('Erro ao conectar ao RabbitMQ:', error);
    res.status(500).send({message:'Erro ao conectar ao RabbitMQ'});
  }
});

app.listen(8000, () => {
  console.log('Produtor iniciado na porta 3001');
});
