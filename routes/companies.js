"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = express.Router();
const db = require("../db");


/** GET "/" => Returns {companies: [{code, name}...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`);

  const companies = results.rows;
  return res.json({ companies });
});

/**GET "/:code" => Returns
 * {company: {code, name, description, invoices: [id...]}}, throws 404 if
 * code not in db
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const companyResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );

  const invoiceResults = await db.query(
    `SELECT id
      FROM invoices AS i
        JOIN companies AS c ON i.comp_code = c.code
        WHERE c.code = $1`,
    [code]
  );

  const company = companyResults.rows[0];
  if (!company) throw new NotFoundError();

  const invoices = invoiceResults.rows.map(i => i.id);
  company.invoices = invoices

  return res.json({ company });
});

/**POST "/" => Returns {company: {code, name, description}}, throws 500 if json
 * incorrect
 */
router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
    [code, name, description]
  );

  const company = results.rows[0];
  return res.json({ company });

});

/**PUT "/:code" Returns {company: {code, name, description}}, throws 500 if json
 * incorrect
*/
router.put("/:code", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { name, description } = req.body;
  const results = await db.query(
    `UPDATE companies
      SET name = $1,
          description = $2
      WHERE code = $3
      RETURNING code, name, description`,
    [name, description, req.params.code]
  );
  if (!results.rows[0]) throw new NotFoundError();
  const company = results.rows[0];
  return res.json({ company });

});

/**DELETE "/:code" =>  Returns { message: "Deleted"} if successful, else throws
 * 404
*/
router.delete("/:code", async function (req, res) {

  const results = await db.query(
    `DELETE FROM companies
        WHERE code = $1
        RETURNING code`, [req.params.code]
  );

  if (!results.rows[0]) throw new NotFoundError();
  return res.json({ message: "Deleted" });

});


module.exports = router;