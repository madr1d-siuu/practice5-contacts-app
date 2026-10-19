const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const path = require("node:path");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

// Публичные DNS-серверы для подключения к MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

const port = process.env.PORT || 8080;

const mongoUrl =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/contacts_db";

app.use(cors());
app.use(express.json());

const client = new MongoClient(mongoUrl);

let contacts;

// Проверка работы REST API
app.get("/api", (req, res) => {
  res.json({
    message: "REST API телефонных контактов работает"
  });
});

// Получение всех контактов
app.get("/api/contacts", async (req, res) => {
  try {
    const result = await contacts
      .find()
      .sort({ lastName: 1 })
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось получить список контактов"
    });
  }
});

// Получение одного контакта по идентификатору
app.get("/api/contacts/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Некорректный идентификатор"
      });
    }

    const contact = await contacts.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!contact) {
      return res.status(404).json({
        error: "Контакт не найден"
      });
    }

    res.json(contact);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось получить контакт"
    });
  }
});

// Добавление нового контакта
app.post("/api/contacts", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email
    } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        error:
          "Необходимо указать имя, фамилию и телефон"
      });
    }

    const newContact = {
      firstName,
      lastName,
      phone,
      email: email || ""
    };

    const result = await contacts.insertOne(newContact);

    res.status(201).json({
      _id: result.insertedId,
      ...newContact
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось добавить контакт"
    });
  }
});

// Полное изменение контакта
app.put("/api/contacts/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Некорректный идентификатор"
      });
    }

    const {
      firstName,
      lastName,
      phone,
      email
    } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        error:
          "Необходимо указать имя, фамилию и телефон"
      });
    }

    const updatedContact = {
      firstName,
      lastName,
      phone,
      email: email || ""
    };

    const result = await contacts.updateOne(
      {
        _id: new ObjectId(req.params.id)
      },
      {
        $set: updatedContact
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Контакт не найден"
      });
    }

    res.json({
      _id: req.params.id,
      ...updatedContact
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось изменить контакт"
    });
  }
});

// Удаление одного контакта
app.delete("/api/contacts/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Некорректный идентификатор"
      });
    }

    const result = await contacts.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Контакт не найден"
      });
    }

    res.json({
      message: "Контакт успешно удалён"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось удалить контакт"
    });
  }
});

// Удаление всех контактов
app.delete("/api/contacts", async (req, res) => {
  try {
    const result = await contacts.deleteMany({});

    res.json({
      message: "Все контакты удалены",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось удалить контакты"
    });
  }
});

// Папка с собранным Angular-приложением
const clientDistPath = path.join(
  __dirname,
  "client",
  "dist",
  "client",
  "browser"
);

// Раздача файлов Angular
app.use(express.static(clientDistPath));

// Возврат Angular-страницы для остальных GET-запросов
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api/")
  ) {
    return res.sendFile(
      path.join(clientDistPath, "index.html")
    );
  }

  next();
});

// Подключение MongoDB и запуск приложения
async function startServer() {
  try {
    await client.connect();

    const database = client.db();

    contacts = database.collection("contacts");

    app.listen(port, "0.0.0.0", () => {
      console.log("База данных MongoDB подключена");
      console.log(
        `Сервер запущен: http://localhost:${port}`
      );
      console.log(
        `Контакты: http://localhost:${port}/api/contacts`
      );
    });
  } catch (error) {
    console.error(
      "Ошибка запуска приложения:",
      error.message
    );

    process.exit(1);
  }
}

startServer();