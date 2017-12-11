#!/usr/bin/env bash
cwd=$(pwd)

function test_npm()
{
  cd ${cwd}
  grunt test
}

test_npm
