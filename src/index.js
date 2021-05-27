// @flow
import { useEffect } from 'react';

const METHOD_LINK_MODAL_ID = 'method-link-modal-id';
const ENV_TYPES = { dev: 'dev', sandbox: 'sandbox', production: 'production' };
const EVENT_CHANNEL_TYPES = { message: 'message', redirect: 'redirect' };
const LINK_MESSAGE_DATA_TYPES = {
  open: 'open',
  exit: 'exit',
  error: 'error',
  success: 'success',
};

type TVoidHandler = () => void;
type TLinkEnvTypes = $Keys<typeof ENV_TYPES>;
type TLinkMessageType = $Keys<typeof LINK_MESSAGE_DATA_TYPES>;
type TLinkMessageDataPayload = {};
type TLinkMessageData = { type: TLinkMessageType, payload: TLinkMessageDataPayload };
type TLinkMessage = { data: TLinkMessageData } & MessageEvent;
type TLinkAPI = { openWithToken: (token: string) => void };
type TLinkEnvConfig = { linkUri: string };
type TLinkOptions = {
  env: TLinkEnvTypes,
  onSuccess?: (data: TLinkMessageDataPayload) => void,
  onError?: (data: TLinkMessageDataPayload) => void,
  onExit?: TVoidHandler,
  onOpen?: TVoidHandler,
};

const _eventNoop = (_?: TLinkMessageDataPayload) => {};

function _getEnv(env: TLinkEnvTypes): TLinkEnvConfig {
  switch (env) {
    case ENV_TYPES.sandbox: return {
      linkUri: 'https://link.sandbox.methodfi.com',
    };
    case ENV_TYPES.production: return {
      linkUri: 'https://link.production.methodfi.com',
    };
    default: return {
      linkUri: 'https://link.dev.methodfi.com',
    };
  }
}

function _validateLinkOptions(options: TLinkOptions): void {
  // TODO: validate options and also provide user-friendly error messages
}

function _composeAuthenticatedURL(linkUri: string, token: string): URL {
  const url = new URL(linkUri);
  url.searchParams.append('token', token);
  url.searchParams.append('event_channel', EVENT_CHANNEL_TYPES.message);
  return url;
}

function _createLinkModal(href: string) {
  const mobileMedia = window.matchMedia('(max-width: 576px)');

  const overlay = window.document.createElement('div');
  overlay.id = METHOD_LINK_MODAL_ID;
  overlay.style.position = 'fixed';
  overlay.style.backgroundColor = 'rgba(144, 144, 144, 0.98)';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.zIndex = 999999999;
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.overflowX = 'hidden';
  overlay.style.overflowY = 'visible';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.margin = 0;
  overlay.style.margin = 0;
  overlay.style.paddingTop = mobileMedia.matches ? 0 : '2%';
  overlay.style.paddingBottom = mobileMedia.matches ? 0 : '4%';

  const iframe = window.document.createElement('iframe');
  iframe.src = href;
  iframe.frameBorder = '0';
  iframe.style.borderRadius = '4px';
  iframe.style.height = mobileMedia.matches ? '100%' : '650px';
  iframe.style.width = mobileMedia.matches ? '100%' :'360px';
  iframe.style.margin = 'auto';
  iframe.style.flex = '0 0 auto';

  overlay.appendChild(iframe);
  return overlay;
}

// eslint-disable-next-line import/prefer-default-export
export function useMethodLink(options: TLinkOptions): TLinkAPI {
  _validateLinkOptions(options);
  const {
    onOpen = _eventNoop,
    onError = _eventNoop,
    onExit = _eventNoop,
    onSuccess = _eventNoop,
  } = options;
  const envConfig = _getEnv(options.env);

  function openWithToken(token: string): void {
    if (document.getElementById(METHOD_LINK_MODAL_ID)) return;
    const iframeUrl = _composeAuthenticatedURL(envConfig.linkUri, token).href;
    const linkModal = _createLinkModal(iframeUrl);
    window.document.body.appendChild(linkModal);
    window.document.body.style.overflow = 'hidden';
  }

  function _closeLink(): void {
    const linkModal = window.document.getElementById(METHOD_LINK_MODAL_ID);
    if (linkModal) {
      linkModal.parentNode.removeChild(linkModal);
      window.document.body.style.overflow = 'inherit';
    }
  }

  useEffect(() => {
    function _handleLinkEvent(event: TLinkMessage): void {
      switch (event.data.type) {
        case LINK_MESSAGE_DATA_TYPES.open: return onOpen();
        case LINK_MESSAGE_DATA_TYPES.success: return onSuccess(event.data.payload);
        case LINK_MESSAGE_DATA_TYPES.error: return onError(event.data.payload);
        case LINK_MESSAGE_DATA_TYPES.exit: return onExit() || _closeLink();
        default:
      }
    }

    function _handleRawEvent(event: MessageEvent): void {
      const isEventFromLink = event.origin === envConfig.linkUri;
      // $FlowFixMe
      return isEventFromLink ? _handleLinkEvent(event) : undefined;
    }

    window.addEventListener('message', _handleRawEvent);
    return () => window.removeEventListener('message', _handleRawEvent);
  }, [onError, onExit, onSuccess]);

  return { openWithToken };
}
