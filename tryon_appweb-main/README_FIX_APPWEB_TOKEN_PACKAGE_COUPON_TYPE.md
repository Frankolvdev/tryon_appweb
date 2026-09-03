# FIX AppWeb — TokenPackage coupon type

Corrige el build TypeScript eliminando el acceso inválido a `TokenPackage.bonus_tokens`.
La validación envía `selectedPackage.tokens_amount`; el backend vuelve a consultar el paquete y conserva la autoridad sobre precio, tokens y cupón.
