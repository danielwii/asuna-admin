workflow "test" {
  on = "push"
  resolves = ["./test"]
}

action "install dependencies" {
  uses = "actions/npm@e7aaefe"
  runs = "npm install"
}

action "./test" {
  uses = "./test"
  needs = ["install dependencies"]
  runs = "yarn test"
}
