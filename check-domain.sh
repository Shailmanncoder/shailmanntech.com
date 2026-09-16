#!/usr/bin/env bash
# Run after changing the A records at GoDaddy to confirm the cutover.
set -u
D=shailmanntech.com
echo "A record (want 76.76.21.21):"
dig +short A $D | sed 's/^/  /'
echo "www (want 76.76.21.21):"
dig +short A www.$D | sed 's/^/  /'
echo "MX (must still be secureserver.net):"
dig +short MX $D | sed 's/^/  /'
echo "Nameservers (must still be domaincontrol.com):"
dig +short NS $D | sed 's/^/  /'
echo "HTTPS:"
printf '  apex -> %s\n' "$(curl -s -o /dev/null -L -m 20 -w '%{http_code}' https://$D)"
printf '  www  -> %s\n' "$(curl -s -o /dev/null -L -m 20 -w '%{http_code}' https://www.$D)"
echo "Served title (want 'Shailmann Tech — Building Modern Digital Products'):"
curl -s -L -m 20 https://$D | grep -io '<title>[^<]*</title>' | head -1 | sed 's/^/  /'
