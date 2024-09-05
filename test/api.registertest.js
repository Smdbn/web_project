// Test to ensure the response status code is 201 (Created)
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

// Test to ensure the response contains a user ID
pm.test("Response has user ID", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
});
