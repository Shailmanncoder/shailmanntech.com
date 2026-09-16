#!/usr/bin/env bash
# Verifies the shailmanntech.com -> Vercel cutover.
#
# Queries GoDaddy's authoritative nameserver and public resolvers rather than
# the local one: after a DNS change your own machine serves a stale cached
# answer for the remainder of the old TTL, which makes a correct cutover look
# broken for up to an hour.
set -u

D=shailmanntech.com
WANT=76.76.21.21
NS=ns05.domaincontrol.com
pass=0; fail=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; fail=$((fail+1)); }

echo "DNS — authoritative ($NS)"
apex=$(dig @$NS $D A +short | tr '\n' ' ' | xargs)
[ "$apex" = "$WANT" ] && ok "A @ -> $apex" \
  || bad "A @ -> ${apex:-<none>} (want exactly $WANT)"

mx=$(dig @$NS $D MX +short | grep -c secureserver.net)
[ "$mx" -ge 1 ] && ok "MX intact ($mx records on secureserver.net)" \
  || bad "MX missing — email is broken"

ns=$(dig @$NS $D NS +short | grep -c domaincontrol.com)
[ "$ns" -ge 1 ] && ok "nameservers still GoDaddy ($ns)" \
  || bad "nameservers moved — MX/DKIM will need rebuilding"

echo "DNS — public resolvers"
for r in 1.1.1.1 8.8.8.8 9.9.9.9; do
  got=$(dig @"$r" $D A +short | tr '\n' ' ' | xargs)
  [ "$got" = "$WANT" ] && ok "$r -> $got" || bad "$r -> ${got:-<none>}"
done

echo "HTTPS (forced to $WANT, ignoring local cache)"
for host in $D www.$D; do
  read -r code verify <<<"$(curl -s -o /dev/null -m 25 \
    --resolve "$host:443:$WANT" -w '%{http_code} %{ssl_verify_result}' "https://$host")"
  { [ "$code" = 200 ] && [ "$verify" = 0 ]; } \
    && ok "$host -> $code, TLS valid" || bad "$host -> $code, TLS result $verify"
done

title=$(curl -s -m 25 --resolve "$D:443:$WANT" "https://$D" \
  | grep -io '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g')
case "$title" in
  *"Shailmann Tech — Building"*) ok "serving: $title" ;;
  *) bad "serving: ${title:-<nothing>} (old GoDaddy page?)" ;;
esac

echo
local_a=$(dig $D A +short | tr '\n' ' ' | xargs)
if [ "$local_a" != "$WANT" ]; then
  ttl=$(dig $D A +noall +answer | awk 'NR==1{print $2}')
  echo "Note: your local resolver still caches $local_a (~$(( ${ttl:-0} / 60 )) min left)."
  echo "      Everyone else sees the new site. To catch up now:"
  echo "      sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder"
  echo
fi

echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
