import {login, register, tokenize} from "../api/authApi";
import {ACTION_FAIL_USER, ACTION_LOGIN_USER, ACTION_LOGOUT_USER} from "../constants/actionTypes";
import {TOKEN_KEY, MOCK_API} from "../const";

export const userRegisterFetch = user => {
  return dispatch => {
    if (user.password !== user.confirmPassword) {
      dispatch(failUser('Passwords differ'));
    } else if (!user || !user.username || !user.password) {
      dispatch(failUser('Username or Password are empty'));
    } else {
      return register({
        username: user.username,
        password: user.password,
      }).then(response => {
        console.log("response", response);
        if (response.status !== 200) {
          console.log("failUser", response.error);
          return failUser('Internal server error');
        } else {
          console.log("loginUser");
          return dispatch(loginUser({token: tokenize(user.username, user.password), username: user.username}));
        }
      }).catch(reason => {
        dispatch(failUser(JSON.stringify(reason)));
      });
    }
  };
};

export const userLoginFetch = user => {
    return dispatch => {
        return login(user)
          .then(resp => {
              return resp.status === 200;
          })
          .then(loggedIn => {
              if (loggedIn) {
                  dispatch(loginUser({token: tokenize(user.username, user.password), username: user.username}))
              } else {
                  dispatch(failUser())
              }
          }).catch(reason => {
              console.error(reason);
          });
    }
};

export const userLogout = () => {
  return dispatch => {
    dispatch(logoutUser());
  };
};

export const checkUser = () => {
  return async dispatch => {
    try {
      const token = await localStorage.getItem(TOKEN_KEY);
      console.log('```', token);
      if (!token) {
        return dispatch(logoutUser());
      } else {
        const response = await me(token);
        if (response.status === 200) {
          const body = await response.json();
          const user = {
            username: body.data.username,
            token: token,
          };
          console.log("user", user);
          return dispatch(loginUser(user));
        } else {
          dispatch(logoutUser());
        }
      }
    } catch(e) {
      failUser(JSON.stringify(e));
    }
  };
};


const loginUser = userObj => ({
  type: ACTION_LOGIN_USER,
  payload: userObj
});

export const me = (token) => (
  fetch(
    `${MOCK_API}/users/me`,
    {
      method: 'GET',
      headers: {
        "Authorization": `Basic ${token}`,
      }
    }
  )
);

export const logoutUser = () => ({
  type: ACTION_LOGOUT_USER,
});

const failUser = error => ({
  type: ACTION_FAIL_USER,
  payload: `${error && error || 'Login or Password are invalid'}`,
});