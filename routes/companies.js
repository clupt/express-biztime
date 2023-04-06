"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = express.Router();
const db = require("../db");

router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`);

  const companies = results.rows;
  return res.json({ companies });
});

router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );

  const company = results.rows[0];
  if (company === undefined) {
    console.log("404 triggered")
    throw new NotFoundError()
  };
  return res.json({ company });
});














module.exports = router;