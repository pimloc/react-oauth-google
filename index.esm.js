import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useMemo,
  useContext,
  useCallback,
} from 'react';

function useLoadGsiScript(options = {}) {
  const { onScriptLoadSuccess, onScriptLoadError } = options;
  const [scriptLoadedSuccessfully, setScriptLoadedSuccessfully] =
    useState(false);
  const onScriptLoadSuccessRef = useRef(onScriptLoadSuccess);
  onScriptLoadSuccessRef.current = onScriptLoadSuccess;
  const onScriptLoadErrorRef = useRef(onScriptLoadError);
  onScriptLoadErrorRef.current = onScriptLoadError;
  useEffect(() => {
    const scriptTag = document.createElement('script');
    scriptTag.src = 'https://accounts.google.com/gsi/client';
    scriptTag.async = true;
    scriptTag.defer = true;
    scriptTag.onload = () => {
      var _a;
      setScriptLoadedSuccessfully(true);
      (_a = onScriptLoadSuccessRef.current) === null || _a === void 0
        ? void 0
        : _a.call(onScriptLoadSuccessRef);
    };
    scriptTag.onerror = () => {
      var _a;
      setScriptLoadedSuccessfully(false);
      (_a = onScriptLoadErrorRef.current) === null || _a === void 0
        ? void 0
        : _a.call(onScriptLoadErrorRef);
    };
    document.body.appendChild(scriptTag);
    return () => {
      document.body.removeChild(scriptTag);
    };
  }, []);
  return scriptLoadedSuccessfully;
}

const GoogleOAuthContext = createContext(null);
function GoogleOAuthProvider({
  clientId,
  onScriptLoadSuccess,
  onScriptLoadError,
  children,
}) {
  const scriptLoadedSuccessfully = useLoadGsiScript({
    onScriptLoadSuccess,
    onScriptLoadError,
  });
  const contextValue = useMemo(
    () => ({
      clientId,
      scriptLoadedSuccessfully,
    }),
    [clientId, scriptLoadedSuccessfully],
  );
  return React.createElement(
    GoogleOAuthContext.Provider,
    { value: contextValue },
    children,
  );
}
function useGoogleOAuth() {
  const context = useContext(GoogleOAuthContext);
  if (!context) {
    throw new Error(
      'Google OAuth components must be used within GoogleOAuthProvider',
    );
  }
  return context;
}

function extractClientId(credentialResponse) {
  var _a;
  try {
    const clientId =
      (_a =
        credentialResponse === null || credentialResponse === void 0
          ? void 0
          : credentialResponse.clientId) !== null && _a !== void 0
        ? _a
        : credentialResponse === null || credentialResponse === void 0
        ? void 0
        : credentialResponse.client_id;
    if (clientId) {
      return clientId;
    }
    if (
      !(credentialResponse === null || credentialResponse === void 0
        ? void 0
        : credentialResponse.credential)
    ) {
      return undefined;
    }
    const payload = JSON.parse(
      atob(credentialResponse.credential.split('.')[1]),
    );
    return payload === null || payload === void 0 ? void 0 : payload.aud;
  } catch {
    return undefined;
  }
}

const containerHeightMap = { large: 40, medium: 32, small: 20 };
function GoogleLogin({
  onSuccess,
  onError,
  useOneTap,
  promptMomentNotification,
  type = 'standard',
  theme = 'outline',
  size = 'large',
  text,
  shape,
  logo_alignment,
  width,
  locale,
  ...props
}) {
  const btnContainerRef = useRef(null);
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const promptMomentNotificationRef = useRef(promptMomentNotification);
  promptMomentNotificationRef.current = promptMomentNotification;
  useEffect(() => {
    var _a, _b, _c;
    if (!scriptLoadedSuccessfully) return;
    (_a = window.google) === null || _a === void 0
      ? void 0
      : _a.accounts.id.initialize({
          client_id: clientId,
          callback: credentialResponse => {
            var _a;
            if (
              !(credentialResponse === null || credentialResponse === void 0
                ? void 0
                : credentialResponse.credential)
            ) {
              return (_a = onErrorRef.current) === null || _a === void 0
                ? void 0
                : _a.call(onErrorRef);
            }
            const { credential, select_by } = credentialResponse;
            onSuccessRef.current({
              credential,
              clientId: extractClientId(credentialResponse),
              select_by,
            });
          },
          ...props,
        });
    (_b = window.google) === null || _b === void 0
      ? void 0
      : _b.accounts.id.renderButton(btnContainerRef.current, {
          type,
          theme,
          size,
          text,
          shape,
          logo_alignment,
          width,
          locale,
        });
    if (useOneTap)
      (_c = window.google) === null || _c === void 0
        ? void 0
        : _c.accounts.id.prompt(promptMomentNotificationRef.current);
    return () => {
      var _a;
      if (useOneTap)
        (_a = window.google) === null || _a === void 0
          ? void 0
          : _a.accounts.id.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clientId,
    scriptLoadedSuccessfully,
    useOneTap,
    type,
    theme,
    size,
    text,
    shape,
    logo_alignment,
    width,
    locale,
  ]);
  return React.createElement('div', {
    ref: btnContainerRef,
    style: { height: containerHeightMap[size] },
  });
}

function googleLogout() {
  var _a;
  (_a = window.google) === null || _a === void 0
    ? void 0
    : _a.accounts.id.disableAutoSelect();
}

/* eslint-disable import/export */
function useGoogleLogin({
  flow = 'implicit',
  scope = '',
  onSuccess,
  onError,
  ...props
}) {
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const clientRef = useRef();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useEffect(() => {
    var _a;
    if (!scriptLoadedSuccessfully) return;
    const clientMethod =
      flow === 'implicit' ? 'initTokenClient' : 'initCodeClient';
    const client =
      (_a = window.google) === null || _a === void 0
        ? void 0
        : _a.accounts.oauth2[clientMethod]({
            client_id: clientId,
            scope: `openid profile email ${scope}`,
            callback: response => {
              var _a, _b;
              if (response.error)
                return (_a = onErrorRef.current) === null || _a === void 0
                  ? void 0
                  : _a.call(onErrorRef, response);
              (_b = onSuccessRef.current) === null || _b === void 0
                ? void 0
                : _b.call(onSuccessRef, response);
            },
            ...props,
          });
    clientRef.current = client;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, scriptLoadedSuccessfully, flow, scope]);
  const loginImplicitFlow = useCallback(
    overrideConfig => clientRef.current.requestAccessToken(overrideConfig),
    [],
  );
  const loginAuthCodeFlow = useCallback(
    () => clientRef.current.requestCode(),
    [],
  );
  return flow === 'implicit' ? loginImplicitFlow : loginAuthCodeFlow;
}

function useGoogleOneTapLogin({
  onSuccess,
  onError,
  promptMomentNotification,
  cancel_on_tap_outside,
  hosted_domain,
}) {
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const promptMomentNotificationRef = useRef(promptMomentNotification);
  promptMomentNotificationRef.current = promptMomentNotification;
  useEffect(() => {
    var _a, _b;
    if (!scriptLoadedSuccessfully) return;
    (_a = window.google) === null || _a === void 0
      ? void 0
      : _a.accounts.id.initialize({
          client_id: clientId,
          callback: credentialResponse => {
            var _a;
            if (
              !(credentialResponse === null || credentialResponse === void 0
                ? void 0
                : credentialResponse.credential)
            ) {
              return (_a = onErrorRef.current) === null || _a === void 0
                ? void 0
                : _a.call(onErrorRef);
            }
            const { credential, select_by } = credentialResponse;
            onSuccessRef.current({
              credential,
              clientId: extractClientId(credentialResponse),
              select_by,
            });
          },
          hosted_domain,
          cancel_on_tap_outside,
        });
    (_b = window.google) === null || _b === void 0
      ? void 0
      : _b.accounts.id.prompt(promptMomentNotificationRef.current);
    return () => {
      var _a;
      (_a = window.google) === null || _a === void 0
        ? void 0
        : _a.accounts.id.cancel();
    };
  }, [
    clientId,
    scriptLoadedSuccessfully,
    cancel_on_tap_outside,
    hosted_domain,
  ]);
}

/**
 * Checks if the user granted all the specified scope or scopes
 * @returns True if all the scopes are granted
 */
function hasGrantedAllScopesGoogle(tokenResponse, firstScope, ...restScopes) {
  if (!window.google) return false;
  return window.google.accounts.oauth2.hasGrantedAllScopes(
    tokenResponse,
    firstScope,
    ...restScopes,
  );
}

/**
 * Checks if the user granted any of the specified scope or scopes.
 * @returns True if any of the scopes are granted
 */
function hasGrantedAnyScopeGoogle(tokenResponse, firstScope, ...restScopes) {
  if (!window.google) return false;
  return window.google.accounts.oauth2.hasGrantedAnyScope(
    tokenResponse,
    firstScope,
    ...restScopes,
  );
}

export {
  GoogleLogin,
  GoogleOAuthProvider,
  googleLogout,
  hasGrantedAllScopesGoogle,
  hasGrantedAnyScopeGoogle,
  useGoogleLogin,
  useGoogleOneTapLogin,
};
