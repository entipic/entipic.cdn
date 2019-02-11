#!/bin/bash

yarn remove @entipic/domain
yarn remove @entipic/data

yarn link @entipic/domain
yarn link @entipic/data

yarn test
