// Test to ensure the response status code is 200 (OK)
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test to ensure the response contains a token
pm.test("Response has token", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("token");
});

// Save the token as an environment variable
pm.test("Save token to environment variable", function () {
  var jsonData = pm.response.json();
  if (jsonData.token) {
    pm.environment.set("authToken", jsonData.token);
  } else {
    pm.expect.fail("Token is missing in the response");
  }
});
