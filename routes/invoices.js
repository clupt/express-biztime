"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = express.Router();
const db = require("../db");

/** GET "/" => Returns {invoices: [{id, comp_code}, ...]}*/
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
      FROM invoices`
  );

  const invoices = results.rows;
  return res.json({ invoices });
});

/** GET "/:id" Returns {invoice: {id, amt, paid, add_date, paid_date, ... */
router.get("/:id", async function (req, res) {
  const id = req.params.id;
  const resultInvoice = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`,
    [id]
  );
  const invoice = resultInvoice.rows[0];

  const resultCompany = await db.query(
    `SELECT code, name, description
      FROM companies as c
        JOIN invoices as i ON c.code = i.comp_code
      WHERE i.id = $1`,
    [id]
  );

  invoice.company = resultCompany.rows[0];
  return res.json({ invoice });
});

/** POST "/"  => Returns {invoice: {id, comp_code, amt, paid, add ... */
router.post("/", async function (req, res) {
  //TODO: or req.body Object.keys length === 0
  if (!req.body) throw new BadRequestError();
  console.log("bodyBODY=", req.body);

  const { comp_code, amt } = req.body;
  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = results.rows[0];
  // if (!results.rows[0]) throw new NotFoundError();
  return res.json({ invoice });
});


/** PUT "/:id" =>
 * Takes JSON body of {amt} Returns  {invoice: {id, comp_code, amt, paid, a...*/
router.put("/:id", async function(req,res){
  let { amt } = req.body;
  const id = req.params.id;

  const results = await db.query(
    `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  )
  const invoice = results.rows[0];
  if(!invoice) throw new NotFoundError();
  return res.json({ invoice });
})

/** DELETE "/:id" => Returns: {status: "deleted"} or 404 if not found*/
router.delete("/:id", async function(req, res){
  const results = await db.query(
    `DELETE FROM invoices
        WHERE id = $1
        RETURNING id`, [req.params.id]
  );

  if (!results.rows[0]) throw new NotFoundError();
  return res.json({ status: "Deleted" });

})

module.exports = router;