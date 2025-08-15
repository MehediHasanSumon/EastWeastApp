import { stringToHex } from "./Lib";
import { removeCookie, setCookie } from "./Storage";

export function setUserdata(res: any): boolean {
  const expiresInAccessToken = res.data.token.accessTokenExpiresIn;
  const expiresInRefreshToken = res.data.token.refreshTokenExpiresIn;

  const hexRefreshToken = stringToHex(res.data.token.refreshToken);
  const hexuserRole = stringToHex(res.data.token.refreshToken);
  const hexUserName = stringToHex(res.data.token.refreshToken);
  const hexUserEmail = stringToHex(res.data.token.refreshToken);

  setCookie("rl_", hexuserRole, expiresInRefreshToken);
  setCookie("at_", res.data.token.accessToken, expiresInAccessToken);
  setCookie("c_user", res.data.user._id, expiresInRefreshToken);
  setCookie("em", hexUserEmail, expiresInRefreshToken);
  setCookie("nm", hexUserName, expiresInRefreshToken);
  setCookie("rt", hexRefreshToken, expiresInRefreshToken);
  return true;
}

export function removeAuthCookies() {
  removeCookie("rl_");
  removeCookie("at_");
  removeCookie("c_user");
  removeCookie("em");
  removeCookie("nm");
  removeCookie("rt");
}
