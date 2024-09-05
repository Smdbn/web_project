// Test to ensure the response status code is 201 (Created)
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

// Test to check if the response contains an expense ID
pm.test("Response has expense ID", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
});

export default function handler(req, res) {
  res.status(200).json({ message: "Expense endpoint reached!" });
}

