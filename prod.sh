#!/bin/bash

yarn unlink @entipic/domain
yarn unlink @entipic/data

yarn add @entipic/domain
yarn add @entipic/data

yarn test
