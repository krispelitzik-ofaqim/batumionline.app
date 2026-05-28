#!/bin/bash
cd "$(dirname "$0")"
export EAS_NO_VCS=1
exec eas build --platform android --profile production
