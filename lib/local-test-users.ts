export function localTesting() {
  return process.env.NODE_ENV === "development" && process.env.QM_LOCAL_TEST_USERS === "true";
}
export const localUsers = [
  {id:"local-admin",email:"admin",role:"ADMIN",password:"admin"},
  {id:"local-juan",email:"Juan",role:"WORKER",password:"listo"},
];
