#!/usr/bin/env bash
cwd=$(pwd)

function setup_npm()
{
  cd ${cwd}

  if [ -d node_modules ]; then
    rm -rf node_modules
  fi

  npm i
}

setup_npm
