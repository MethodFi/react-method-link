# react-method-link

[![NPM](https://img.shields.io/npm/v/react-method-link.svg)](https://www.npmjs.com/package/react-method-link)

## Install

```bash
npm install --save react-method-link
```

## Usage

```jsx
import React from 'react';
import { useMethodLink } from 'react-method-link';

const App = () => {
  const myAPIClient = {
    exchangeLinkToken: (data) => {},
    generateLinkToken: (options) => {},
  };

  const { openWithToken } = useMethodLink({
    env: 'dev', // Defaults to 'dev'. Use 'production' when you're ready to go live.
    onOpen: () => {},
    onExit: () => {},
    onError: (error) => {},
    onSuccess: data => myAPIClient.exchangeLinkToken(data),
  });
  
  const onClick = async () => {
    const token = await myAPIClient.generateLinkToken({});
    openWithToken(token);
  };

  return (
    <div>
      <header>
        <button type="button" onClick={onClick}>
          Open Method Link
        </button>
      </header>
    </div>
  );
};
```
